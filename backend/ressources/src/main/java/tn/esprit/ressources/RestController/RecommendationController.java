package tn.esprit.ressources.RestController;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import tn.esprit.ressources.Service.Interface.RecommendationService;
import tn.esprit.ressources.dto.RecommendationProductResponse;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/me")
    public ResponseEntity<List<RecommendationProductResponse>> getPersonalizedRecommendations(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "10") int limit) {

        String userId = jwt.getSubject();

        int safeLimit = Math.max(1, Math.min(limit, 3));

        List<RecommendationProductResponse> recommendations =
                recommendationService.recommendForUser(userId, safeLimit);

        return ResponseEntity.ok(recommendations);
    }

    @GetMapping("/product/{id}")
    public ResponseEntity<List<RecommendationProductResponse>> getSimilarProducts(
            @PathVariable("id") Long productId,
            @RequestParam(defaultValue = "10") int limit) {

        int safeLimit = Math.max(1, Math.min(limit, 50));

        List<RecommendationProductResponse> recommendations =
                recommendationService.recommendSimilarToProduct(productId, safeLimit);

        return ResponseEntity.ok(recommendations);
    }

    @GetMapping("/top3")
    public ResponseEntity<List<RecommendationProductResponse>> getTop3MostOrderedProducts() {

        List<RecommendationProductResponse> topProducts =
                recommendationService.getTop3MostOrderedProducts();

        return ResponseEntity.ok(topProducts);
    }
}