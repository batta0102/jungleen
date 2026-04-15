package tn.esprit.ressources.RestController;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.ressources.Entites.Order;
import tn.esprit.ressources.Service.Interface.OrderService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrderController {
    @Autowired
    private OrderService orderService;

    // CREATE - Allow any authenticated user (student/admin) to create orders
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/addOrder")
    public Order addOrder(@RequestBody Order order, @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing authenticated user subject");
        }
        
        order.setUserId(jwt.getSubject()); // ✅ id Keycloak du client
        
        String emailClaim = jwt.getClaimAsString("email");
        if (emailClaim == null || emailClaim.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                "Email claim missing in JWT. Cannot create order without customer email.");
        }
        order.setUserEmail(emailClaim);
        
        return orderService.addOrder(order);
    }

    // UPDATE - Only teacher can update orders
    @PreAuthorize("hasRole('teacher')")
    @PutMapping("/updateOrder/{id}")
    public Order updateOrder(@PathVariable Long id, @RequestBody Order order) {
        return orderService.updateOrder(id, order);
    }

    // GET ONE - Any authenticated user can view an order
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/getOrder/{id}")
    public Order getOrder(@PathVariable Long id) {
        return orderService.getOrderById(id);
    }
    // GET ALL - Any authenticated user can list orders (for admin panel)
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/allOrders")
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    // DELETE - Only teacher can delete orders
    @PreAuthorize("hasRole('teacher')")
    @DeleteMapping("/deleteOrder/{id}")
    public void deleteOrder(@PathVariable Long id) {
        orderService.deleteOrder(id);
    }
}
