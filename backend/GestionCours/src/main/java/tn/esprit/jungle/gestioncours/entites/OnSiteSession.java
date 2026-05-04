package tn.esprit.jungle.gestioncours.entites;

import jakarta.persistence.*;
import lombok.*;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "on_site_session")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OnSiteSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Date date;

    @Column(nullable = false)
    private int capacity;

    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private OnSiteCourse course;

    @ManyToOne
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OnSiteBooking> bookings;
}
