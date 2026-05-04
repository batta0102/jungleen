package tn.esprit.pidraft.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
public class SessionTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    @Enumerated(EnumType.STRING)
    private StatutSession statut;

    private Double scoreTotal;
    private Double pourcentage;
    private Long tempsPasseSecondes;

    // Tab switch detection & integrity tracking
    private Integer tabSwitchCount = 0;
    private Boolean suspiciousBehavior = false;

    // User identification
    private String userName;
    private String userEmail;
    private Long userId; // Link to user-service

    @ManyToOne
    @JsonIgnoreProperties({"questions"})
    private QCM qcm;

    @OneToMany(mappedBy = "sessionTest", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<ReponseDonnee> reponses;

    @OneToMany(mappedBy = "sessionTest", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<QuizEvent> quizEvents;
}
