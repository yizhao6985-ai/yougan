export interface InspirationRecommendation {
  id: string;
  suggestion: string;
}

export interface WorkInspirationRecommendations {
  workId: string;
  title: string;
  recommendations: InspirationRecommendation[];
}
