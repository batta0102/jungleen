package tn.esprit.ressources.Service.Impliments;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.ressources.Entites.Order;
import tn.esprit.ressources.Entites.Product;
import tn.esprit.ressources.Repository.DeliveryRepository;
import tn.esprit.ressources.Repository.OrderRepository;
import tn.esprit.ressources.Repository.ProductRepository;
import tn.esprit.ressources.Service.Interface.OrderService;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final DeliveryRepository deliveryRepository;

    @Override
    public Order addOrder(Order order) {
        if (order.getUserId() == null || order.getUserId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Order.userId is required");
        }

        if (order.getProduct() == null || order.getProduct().getIdProduct() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product is required");
        }

        Long productId = order.getProduct().getIdProduct();
        Product managedProduct = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id=" + productId));

        if (managedProduct.getStock() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product out of stock");
        }
        managedProduct.setStock(managedProduct.getStock() - 1); productRepository.save(managedProduct);

        order.setProduct(managedProduct);


        return orderRepository.save(order);
    }

    @Override
    public Order updateOrder(Long id, Order order) {
        Order existing = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        existing.setTotalAmount(order.getTotalAmount());
        existing.setStatus(order.getStatus());
        existing.setAddress(order.getAddress());
        existing.setOrderDate(order.getOrderDate());
        existing.setPaymentMethod(order.getPaymentMethod());

        // important: attach managed product
        if (order.getProduct() != null && order.getProduct().getIdProduct() != null) {
            Long productId = order.getProduct().getIdProduct();
            Product managedProduct = productRepository.findById(productId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with id=" + productId));
            existing.setProduct(managedProduct);
        }

        return orderRepository.save(existing);
    }
    @Override
    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    @Override
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @Override
    public void deleteOrder(Long id) {
        if (!orderRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found with id=" + id);
        }

        deliveryRepository.deleteByOrder_IdOrder(id);
        orderRepository.deleteById(id);
    }
}
