package tn.esprit.jungle.gestioncours.entites;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;
import java.util.List;

/**
 * OnlineSession Entity - Domain model for online sessions
 * Represents the core business entity for online session management
 */
@Entity
@Table(name = "online_session")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OnlineSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Date date;

    private int capacity;

    private String meetingLink;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private OnlineCourse course;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    private List<OnlineBooking> bookings;
}
