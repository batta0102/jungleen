package tn.esprit.ressources.Service.Interface;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import tn.esprit.ressources.Entites.Delivery;

import java.util.List;
import java.util.Map;

public interface DeliveryService {
    public Delivery createDelivery(Delivery delivery);

    List<Delivery> getAllDeliveries();

    Delivery getDeliveryById(Long id);

    Delivery updateDelivery(Long id, Delivery delivery);

    void deleteDelivery(Long id);

    Delivery getDeliveryByTrackingNumber(String trackingNumber);
}
