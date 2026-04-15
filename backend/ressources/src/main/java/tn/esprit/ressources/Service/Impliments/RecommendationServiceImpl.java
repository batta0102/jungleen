package tn.esprit.ressources.Service.Impliments;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.esprit.ressources.Repository.ProductRecommendationProjection;
import tn.esprit.ressources.Repository.ProductRepository;
import tn.esprit.ressources.Service.Interface.RecommendationService;
import tn.esprit.ressources.dto.RecommendationProductResponse;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RecommendationServiceImpl implements RecommendationService {

    private final ProductRepository productRepository;
    private static final int TOP_LIMIT = 3;

    @Override
    public List<RecommendationProductResponse> recommendForUser(String userId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), TOP_LIMIT);
        return fetchTopMostOrderedProducts(safeLimit);
    }

    @Override
    public List<RecommendationProductResponse> recommendSimilarToProduct(Long productId, int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), TOP_LIMIT);
        return fetchTopMostOrderedProducts(safeLimit);
    }

    @Override
    public List<RecommendationProductResponse> getTop3MostOrderedProducts() {
        return fetchTopMostOrderedProducts(TOP_LIMIT);
    }

    private List<RecommendationProductResponse> fetchTopMostOrderedProducts(int limit) {
        List<ProductRecommendationProjection> topProducts =
            productRepository.findTop3MostOrderedProducts(PageRequest.of(0, limit));

        return topProducts.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    private RecommendationProductResponse mapToResponse(ProductRecommendationProjection projection) {
        long ordersCount = projection.getOrdersCount() != null ? projection.getOrdersCount() : 0L;

        return RecommendationProductResponse.builder()
            .id(projection.getProductId())
            .title(projection.getProductName())
            .category(projection.getProductCategory())
            .ordersCount(ordersCount)
            .score((double) ordersCount)
            .build();
    }
}
