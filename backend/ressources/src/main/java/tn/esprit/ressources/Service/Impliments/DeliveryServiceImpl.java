package tn.esprit.ressources.Service.Impliments;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.ressources.Entites.Delivery;
import tn.esprit.ressources.Entites.Order;
import tn.esprit.ressources.Repository.DeliveryRepository;
import tn.esprit.ressources.Repository.OrderRepository;
import tn.esprit.ressources.Service.Interface.DeliveryService;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliveryServiceImpl implements DeliveryService {
    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final EmailService emailService;

    @Override
    public Delivery createDelivery(Delivery delivery) {
        if (delivery == null || delivery.getOrder() == null || delivery.getOrder().getIdOrder() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload must include order.idOrder");
        }

        Long orderId = delivery.getOrder().getIdOrder();
        Order managedOrder = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found with id=" + orderId));

        delivery.setOrder(managedOrder);

        if (delivery.getTrackingNumber() == null || delivery.getTrackingNumber().isBlank()) {
            delivery.setTrackingNumber(generateUniqueTrackingNumber());
        } else if (deliveryRepository.existsByTrackingNumber(delivery.getTrackingNumber())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tracking number already exists");
        }

        Delivery savedDelivery = deliveryRepository.save(delivery);

        // Validate customer email is present in order
        String customerEmail = managedOrder.getUserEmail();
        if (customerEmail == null || customerEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Order has no userEmail. Customer must provide email when creating order.");
        }

        log.info("Sending tracking number {} to customer email: {}", savedDelivery.getTrackingNumber(), customerEmail);
        emailService.sendTrackingNumber(customerEmail, savedDelivery.getTrackingNumber());

        return savedDelivery;
    }



    private String generateUniqueTrackingNumber() {

            String tracking;
            int attempts = 0;

            do {
                attempts++;
                if (attempts > 10) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to generate unique tracking number");
                }

                tracking = "TN-" + UUID.randomUUID().toString()
                        .replace("-", "")
                        .substring(0, 16)
                        .toUpperCase();

            } while (deliveryRepository.existsByTrackingNumber(tracking));

            return tracking;
    }

    @Override
    public Delivery updateDelivery(Long id, Delivery delivery) {
            Delivery existing = deliveryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found with id=" + id));

            existing.setDeliveryAddress(delivery.getDeliveryAddress());
            existing.setDeliveryStatus(delivery.getDeliveryStatus());
            existing.setDeliveryDate(delivery.getDeliveryDate());


            if (delivery.getOrder() != null && delivery.getOrder().getIdOrder() != null) {
                Long orderId = delivery.getOrder().getIdOrder();
                Order managedOrder = orderRepository.findById(orderId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found with id=" + orderId));
                existing.setOrder(managedOrder);
            }

            return deliveryRepository.save(existing);
        }

    @Override
    public List<Delivery> getAllDeliveries() {
        return deliveryRepository.findAll();
    }

    @Override
    public Delivery getDeliveryById(Long id) {
        return deliveryRepository.findById(id).orElse(null);
    }



    @Override
    public void deleteDelivery(Long id) {
        deliveryRepository.deleteById(id);
    }


    @Override
    public Delivery getDeliveryByTrackingNumber(String trackingNumber) {
        return deliveryRepository.findByTrackingNumber(trackingNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Delivery not found with tracking number: " + trackingNumber));

    }
}

