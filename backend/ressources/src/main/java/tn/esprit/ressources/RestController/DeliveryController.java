package tn.esprit.ressources.RestController;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.ressources.Entites.Delivery;
import tn.esprit.ressources.Service.Interface.DeliveryService;

import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import java.util.Map;


@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {
    private final DeliveryService deliveryService;

    @PreAuthorize("hasRole('teacher')")
    @PostMapping("/addDelivery")
    public Delivery createDelivery(@RequestBody Delivery delivery) {
        if (delivery == null || delivery.getOrder() == null || delivery.getOrder().getIdOrder() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload must include order.idOrder");
        }
        return deliveryService.createDelivery(delivery);
    }

    // READ ALL
    @GetMapping("/Alldelivery")
    public List<Delivery> getAllDeliveries() {
        return deliveryService.getAllDeliveries();
    }

    // READ BY ID
    @GetMapping("/getDelivery/{id}")
    public Delivery getDelivery(@PathVariable Long id) {
        return deliveryService.getDeliveryById(id);
    }

    // UPDATE
    @PutMapping("/updateDelivery/{id}")
    public Delivery updateDelivery(@PathVariable Long id,
                                   @RequestBody Delivery delivery) {
        return deliveryService.updateDelivery(id, delivery);
    }

    // DELETE
    @DeleteMapping("/deleteDelivery/{id}")
    public void deleteDelivery(@PathVariable Long id) {
        deliveryService.deleteDelivery(id);
    }

    @GetMapping("/track/{trackingNumber}")
    public Delivery trackDelivery(@PathVariable String trackingNumber) {
        return deliveryService.getDeliveryByTrackingNumber(trackingNumber);}

    @GetMapping("/me")
    public Map<String,Object> me(@AuthenticationPrincipal Jwt jwt){
        return Map.of(
                "iss", jwt.getIssuer().toString(),
                "sub", jwt.getSubject(),
                "email", jwt.getClaimAsString("email")
        );
    }
}



