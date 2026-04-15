package tn.esprit.ressources.Entites;


import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.ManyToOne;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idOrder;

    private Double totalAmount;

    private String status;
    private String address;

    private LocalDateTime orderDate;

    private String paymentMethod;
    @Column(name = "user_id", length = 128, nullable = false)
    private String userId;
    @Column(name = "user_email", length = 255, nullable = false)
    private String userEmail;

    @ManyToOne
    private Product product;

    @JsonManagedReference
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Delivery> deliveries = new ArrayList<>();
}
