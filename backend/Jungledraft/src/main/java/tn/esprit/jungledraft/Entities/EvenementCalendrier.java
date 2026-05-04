package tn.esprit.jungledraft.Entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EvenementCalendrier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "buddy_pair_id")
    private BuddyPair buddyPair;

    private String titre;
    private String description;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;

    @Enumerated(EnumType.STRING)
    private TypeEvenement type;

    private Long sessionId;
    private boolean rappelEnvoye;

    @Column(nullable = false)
    private boolean rappelUrgentEnvoye = false;
}