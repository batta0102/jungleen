package tn.esprit.pidraft.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Certificat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numeroCertificat;
    private String matiere;
    private Double scoreFinal;
    private LocalDate dateDelivrance;

    // User info (since there's no user table in PiDraft)
    private String userName;
    private String userEmail;

    // Stores the titles of the 3 QCMs that qualified the user
    @Column(length = 1000)
    private String qualifyingQuizTitles;

    // Average percentage across the 3 qualifying quizzes
    private Double averagePercentage;

    @OneToOne
    private Resultat resultat;
}
