package tn.esprit.jungledraft.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Date;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BuddyPair {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPair;

    private Long userID_1;
    private Long userID_2;

    @ManyToOne
    private Club club;

    private Date dateCreation;
    private String niveauCible;
    private boolean actif;

    @Enumerated(EnumType.STRING)
    private BuddyMatchStatus status;

    private Date dateDebut;
    private Date dateFin;

    private int sessionsPlanifiees;
    private int sessionsRealisees;

    @OneToMany(mappedBy = "buddyPair", cascade = CascadeType.ALL)
    private List<BuddySession> sessions;
}