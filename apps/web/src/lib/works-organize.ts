import type { Work, WorkGroup } from "@/lib/types";

export function organizeWorksByGroup(works: Work[], groups: WorkGroup[]) {
  const ungroupedWorks = works.filter((work) => !work.groupId);
  const groupedWorks = groups.map((group) => ({
    group,
    works: works.filter((work) => work.groupId === group.id),
  }));

  return { ungroupedWorks, groupedWorks };
}
