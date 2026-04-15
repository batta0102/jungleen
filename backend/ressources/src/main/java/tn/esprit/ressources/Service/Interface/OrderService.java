package tn.esprit.ressources.Service.Interface;

import tn.esprit.ressources.Entites.Order;

import java.util.List;

public interface OrderService {
    Order addOrder(Order order);

    Order updateOrder(Long id, Order order);

    Order getOrderById(Long id);

    List<Order> getAllOrders();

    void deleteOrder(Long id);
}
