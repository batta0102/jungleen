package tn.esprit.jungle.gestioncours.entites;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "on_site_course")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OnSiteCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Level level;

    @Column(nullable = false)
    private Long tutorId;

    @Column(length = 1000)
    private String description;

    @Column(name = "classroom_name")
    private String classroomName;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OnSiteSession> sessions;
}
