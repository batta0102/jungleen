package tn.esprit.jungle.gestioncours.entites;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

/**
 * OnlineBooking Entity - Domain model for online bookings
 * Represents student bookings for online sessions
 */
@Entity
@Table(name = "online_booking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OnlineBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Date bookingDate;

    private String status;

    // Reference to Student microservice
    private Long studentId;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private OnlineSession session;
}
