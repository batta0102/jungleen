package tn.esprit.pidraft.entities;

import com.fasterxml.jackson.annotation.JsonManagedReference;
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
public class QCM {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String contenu;

    @Enumerated(EnumType.STRING)
    private TypeQCM type;

    @Enumerated(EnumType.STRING)
    private TypeCible cible;

    private Integer dureeMinutes;
    private LocalDateTime datePublication;
    private LocalDateTime dateDebutDisponibilite;
    private LocalDateTime dateFinDisponibilite;
    private Integer tentativesMax;
    private Double noteMax;

    @OneToMany(mappedBy = "qcm", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Question> questions;

}
