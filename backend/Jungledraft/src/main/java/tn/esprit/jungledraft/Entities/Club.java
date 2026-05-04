package tn.esprit.jungledraft.Entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
public class Club {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idClub;

    private String nom;

    private String clubOwner;

    private String description;

    private String niveau;

    private Date dateCreation;

    private int capacityMax;

    @Enumerated(EnumType.STRING)
    private ClubStatus status;

    @OneToMany(mappedBy = "club")
    private List<ClubMessage> messages;
    @JsonIgnore
    @OneToMany(mappedBy = "club")
    private List<BuddyPair> buddyPairs;

    @JsonIgnore
    @OneToMany(mappedBy = "club")
    private List<ClubMembership> memberships;


}
