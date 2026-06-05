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
