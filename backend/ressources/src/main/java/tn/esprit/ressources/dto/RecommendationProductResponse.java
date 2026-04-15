package tn.esprit.ressources.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationProductResponse {

    private Long id;

    private String title;

    private String category;

    private Long ordersCount;

    private Double score;
}
