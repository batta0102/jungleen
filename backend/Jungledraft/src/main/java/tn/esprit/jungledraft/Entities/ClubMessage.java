package tn.esprit.jungledraft.Entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClubMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMessage;

    private Long userId;

    private String contenu;

    private int likes;

    private Date dateEnvoi;

    private boolean epingle = false;           // Est-ce que le message est épinglé ?
    private Date dateEpingle;                   // Date à laquelle il a été épinglé
    private String raisonEpingle;               // Pourquoi il a été épinglé (auto/manual)

    @JsonIgnore
    @ManyToOne(cascade = CascadeType.ALL)
    private Club club;



}