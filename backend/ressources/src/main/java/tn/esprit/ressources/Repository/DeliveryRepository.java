package tn.esprit.ressources.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.esprit.ressources.Entites.Delivery;

import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    boolean existsByTrackingNumber(String trackingNumber);
    Optional<Delivery> findByTrackingNumber(String trackingNumber);
    long deleteByOrder_IdOrder(Long orderId);

}
