package tn.esprit.pidraft.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Poste {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titre;
    private String contenu;
    private String description;
    private String niveauRequis;
    private int experienceRequise;
    private String datePublication; // ✅ String au lieu de LocalDate
    private boolean actif;

    @OneToMany(mappedBy = "poste")
    @JsonIgnore
    private List<Candidature> candidatures;
}