package tn.esprit.pidraft.entities;

import jakarta.persistence.*;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
@AllArgsConstructor
@NoArgsConstructor
@Data
@Entity
public class ReponseDonnee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Boolean estCorrect;
    private Double scoreObtenu;

    @ManyToOne
    private Question question;

    @ManyToMany
    private List<ChoixReponse> choixSelectionnes;

    @ManyToOne
    private SessionTest sessionTest;
}
