/** 灵感推荐 agent 子图：input.title → output.recommendations */
import { END, START, StateGraph } from "@langchain/langgraph";

import { generateInspirationRecommendationsWithDeepSeek } from "./recommend.js";
import {
  InspirationRecommendationsState,
  type InspirationRecommendationsStateType,
} from "./state.js";

async function inspirationRecommendationsNode(
  state: InspirationRecommendationsStateType,
) {
  const recommendations = await generateInspirationRecommendationsWithDeepSeek(
    state.title,
  );
  return { recommendations };
}

export const graph = new StateGraph(InspirationRecommendationsState)
  .addNode("inspiration_recommendations", inspirationRecommendationsNode)
  .addEdge(START, "inspiration_recommendations")
  .addEdge("inspiration_recommendations", END)
  .compile();
