package tn.esprit.ressources.Service.Interface;

import tn.esprit.ressources.dto.RecommendationProductResponse;
import java.util.List;

public interface RecommendationService {

    List<RecommendationProductResponse> recommendForUser(String userId, int limit);

    List<RecommendationProductResponse> recommendSimilarToProduct(Long productId, int limit);

    List<RecommendationProductResponse> getTop3MostOrderedProducts();
}