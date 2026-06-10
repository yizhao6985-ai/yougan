import type { WorkReference } from "@yougan/domain";

export function upsertAssetReference(
  references: WorkReference[],
  item: WorkReference,
): WorkReference[] {
  const url = item.asset.url;
  const refs = [...references];
  const index = refs.findIndex((ref) => ref.asset.url === url);
  if (index >= 0) {
    refs[index] = { ...item, id: refs[index]!.id, created_at: refs[index]!.created_at };
    return refs;
  }
  return [...refs, item];
}
