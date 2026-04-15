package tn.esprit.ressources.Repository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tn.esprit.ressources.Entites.Product;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    @Query("SELECT p.idProduct as productId, " +
           "p.name as productName, " +
           "p.category as productCategory, " +
           "COUNT(o.idOrder) as ordersCount " +
           "FROM Product p " +
           "LEFT JOIN p.orders o " +
           "GROUP BY p.idProduct, p.name, p.category " +
           "ORDER BY COUNT(o.idOrder) DESC")
    List<ProductRecommendationProjection> findTop3MostOrderedProducts(Pageable pageable);
}
