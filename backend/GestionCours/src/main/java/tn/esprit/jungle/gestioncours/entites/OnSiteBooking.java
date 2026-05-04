package tn.esprit.jungle.gestioncours.entites;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;

@Entity
@Table(name = "on_site_booking")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OnSiteBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Date bookingDate;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private Long studentId;

    @ManyToOne
    @JoinColumn(name = "session_id", nullable = false)
    private OnSiteSession session;
}
