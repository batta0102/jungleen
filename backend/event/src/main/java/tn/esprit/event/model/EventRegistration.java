package tn.esprit.event.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "event_registrations")
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "name")
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(name = "payment_intent_id")
    private String paymentIntentId;

    @Column(name = "payment_required", nullable = false)
    private Integer paymentRequired = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "registration_status")
    private String registrationStatus = "CONFIRMED";

    @PrePersist
    private void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (registrationStatus == null || registrationStatus.isBlank()) {
            registrationStatus = "CONFIRMED";
        }
        if ((name == null || name.isBlank()) && firstName != null && !firstName.isBlank()) {
            name = firstName;
        }
    }
}
