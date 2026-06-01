/** 灵感推荐子图：input.title → output.recommendations */
import { END, START, StateGraph } from "@langchain/langgraph";

import { generateInspirationRecommendationsWithDeepSeek } from "./nodes/recommend/index.js";
import {
  InspirationRecommendationsState,
  type InspirationRecommendationsStateType,
} from "./state.js";

async function recommendNode(state: InspirationRecommendationsStateType) {
  const recommendations = await generateInspirationRecommendationsWithDeepSeek(
    state.title,
  );
  return { recommendations };
}

export const graph = new StateGraph(InspirationRecommendationsState)
  .addNode("recommend", recommendNode)
  .addEdge(START, "recommend")
  .addEdge("recommend", END)
  .compile();
