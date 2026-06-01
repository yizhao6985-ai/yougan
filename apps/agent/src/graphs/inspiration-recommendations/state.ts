import { Annotation } from "@langchain/langgraph";

import type { InspirationRecommendation } from "./nodes/recommend/schema.js";

export const InspirationRecommendationsState = Annotation.Root({
  title: Annotation<string>,
  recommendations: Annotation<InspirationRecommendation[]>,
});

export type InspirationRecommendationsStateType =
  typeof InspirationRecommendationsState.State;
