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
public class Disponibilite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "buddy_pair_id")
    private BuddyPair buddyPair;

    private LocalDateTime debut;
    private LocalDateTime fin;

    @Enumerated(EnumType.STRING)
    private JourSemaine jour;

    private boolean recurrent;
    private LocalDateTime dateDebutValidite;
    private LocalDateTime dateFinValidite;

    private Long userId;
}