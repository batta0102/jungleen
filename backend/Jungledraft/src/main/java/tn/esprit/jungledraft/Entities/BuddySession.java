package tn.esprit.jungledraft.Entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BuddySession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idSession;

    private LocalDateTime date;
    private int duree;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status = SessionStatus.PLANIFIEE;

    @JsonIgnore
    @ManyToOne
    private BuddyPair buddyPair;

    private String sujet;
    private String notes;

    private boolean confirmeParUtilisateur1;
    private boolean confirmeParUtilisateur2;

    @Column(nullable = false)
    private boolean rappelEnvoye = false;
    private String lieu;

    @Enumerated(EnumType.STRING)
    private SatisfactionLevel satisfactionUtilisateur1;

    @Enumerated(EnumType.STRING)
    private SatisfactionLevel satisfactionUtilisateur2;
}