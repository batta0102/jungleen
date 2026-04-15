/**
 * Recommendation Product Interface
 * Represents a product returned by the recommendation service
 */
export interface RecommendationProduct {
  idProduct: number;
  name: string;
  category: string;
  description: string;
  imageUrl?: string;
  price?: number;
  stock: number;
  score?: number; // Recommendation relevance score
}

/**
 * Recommendation Response from API
 */
export interface RecommendationResponse {
  products: RecommendationProduct[];
  totalCount: number;
  category?: string;
}
