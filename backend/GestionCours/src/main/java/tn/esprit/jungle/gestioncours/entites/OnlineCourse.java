package tn.esprit.jungle.gestioncours.entites;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

/**
 * OnlineCourse Entity - Domain model for online courses
 * Represents the core business entity for online course management
 */
@Entity
@Table(name = "online_course")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OnlineCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Level level;

    @Column(nullable = false)
    private Long tutorId;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OnlineSession> sessions;
}
