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
public class ClubMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idInscription;

    private Date dateInscription;

    @Enumerated(EnumType.STRING)
    private InscriptionStatus status;

    private Long userId;

    @JsonIgnore
    @ManyToOne(cascade = CascadeType.ALL)
    private Club club;

}
