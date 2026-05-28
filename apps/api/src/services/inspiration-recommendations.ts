import { getWork } from "./works.js";
import { runInspirationRecommendationsAgent } from "./agent-runs.js";

export async function getWorkInspirationRecommendations(
  userId: string,
  workId: string,
) {
  const work = await getWork(userId, workId);
  if (!work) return null;

  const recommendations = await runInspirationRecommendationsAgent(work.title);
  return { workId: work.id, title: work.title, recommendations };
}
