package tn.esprit.ressources.Repository;
public interface ProductRecommendationProjection {
    Long getProductId();

    String getProductName();

    String getProductCategory();

    Long getOrdersCount();
}
