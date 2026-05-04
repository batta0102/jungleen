package tn.esprit.jungledraft.DTO;

import tn.esprit.jungledraft.Entities.InscriptionStatus;
import java.util.Date;

public class ClubMembershipDTO {
    private Long idInscription;
    private Date dateInscription;
    private InscriptionStatus status;
    private Long userId;
    private Long clubId;  // Champ direct pour l'ID du club
    private ClubDTO club;  // Gardez aussi l'objet ClubDTO si nécessaire

    // Constructeurs
    public ClubMembershipDTO() {}

    // Getters et Setters
    public Long getIdInscription() { return idInscription; }
    public void setIdInscription(Long idInscription) { this.idInscription = idInscription; }

    public Date getDateInscription() { return dateInscription; }
    public void setDateInscription(Date dateInscription) { this.dateInscription = dateInscription; }

    public InscriptionStatus getStatus() { return status; }
    public void setStatus(InscriptionStatus status) { this.status = status; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getClubId() { return clubId; }  // Getter pour clubId
    public void setClubId(Long clubId) { this.clubId = clubId; }  // Setter pour clubId

    public ClubDTO getClub() { return club; }
    public void setClub(ClubDTO club) { this.club = club; }

    // Classe interne pour Club
    public static class ClubDTO {
        private Long idClub;
        private String nom;

        public ClubDTO() {}

        public Long getIdClub() { return idClub; }
        public void setIdClub(Long idClub) { this.idClub = idClub; }

        public String getNom() { return nom; }
        public void setNom(String nom) { this.nom = nom; }
    }
}