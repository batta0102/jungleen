package tn.esprit.jungle.gestioncours.entites;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "classroom")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Classroom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClassroomType type;

    private String featuresDescription;

    @Column(name = "sketchfab_model_uid", length = 64)
    private String sketchfabModelUid;

    @OneToMany(mappedBy = "classroom", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OnSiteSession> sessions;
}
