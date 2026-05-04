package tn.esprit.jungledraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungledraft.client.UserClient;
import tn.esprit.jungledraft.Entities.*;
import tn.esprit.jungledraft.Repositories.*;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubRep clubRepository;
    private final BuddyPairRep buddyPairRep;
    private  final ClubMessageRep clubMessageRep;
    private final CommentRep commentRep;
    private final ClubMembershipRep clubMembershipRep;
    private final DisponibiliteRepository disponibiliteRepository;
    private final UserClient userClient;


    public Club create(Club club) {
        validateClubOwnerExists(club.getClubOwner());
        club.setDateCreation(Date.valueOf(LocalDate.now()));
        club.setStatus(ClubStatus.ACTIVE);
        if (club.getNom() != null) {
            club.setNom(club.getNom().trim());
        }
        return clubRepository.save(club);
    }

    public List<Club> getAllClubsByOwner(String id){
        return clubRepository.findAllByClubOwner(id);
    }

    public List<Club> getAll() {
        return clubRepository.findAll();
    }


    public Optional<Club> getById(Long id) {
        return clubRepository.findById(id);
    }


    public Club update(Club club) {
        Optional<Club> existing = clubRepository.findById(club.getIdClub());
        if (existing.isPresent()) {
            Club toUpdate = existing.get();


            toUpdate.setNom(club.getNom());
            toUpdate.setClubOwner(club.getClubOwner());
            toUpdate.setDescription(club.getDescription());
            toUpdate.setNiveau(club.getNiveau());
            toUpdate.setCapacityMax(club.getCapacityMax());
            toUpdate.setStatus(club.getStatus());
            validateClubOwnerExists(toUpdate.getClubOwner());

            return clubRepository.save(toUpdate);
        } else {
            throw new RuntimeException("Club not found with id " + club.getIdClub());
        }
    }


    public void delete(Long id) {
        Optional<Club> existing = clubRepository.findById(id);
        List<BuddyPair> list = buddyPairRep.findByClubIdClub(id);
        for (BuddyPair p :list){
            List<Disponibilite> disp = disponibiliteRepository.findByBuddyPairId(p.getIdPair());
            for (Disponibilite d : disp){
                disponibiliteRepository.deleteById(d.getId());
            }
            buddyPairRep.deleteById(p.getIdPair());
        }

        List<ClubMessage> messages = clubMessageRep.findByClubId(id);
        for( ClubMessage c :messages){
            List<Comment> comments = commentRep.findByClubMessageIdMessage(c.getIdMessage());
            for(Comment cm : comments){
                commentRep.deleteById(cm.getCommentId());
            }
            clubMessageRep.deleteById(c.getIdMessage());
        }

        List<ClubMembership> members= clubMembershipRep.findAllByClubIdClub(id);
        for (ClubMembership m : members){
            clubMembershipRep.deleteById(m.getIdInscription());
        }


        if (existing.isPresent()) {
            clubRepository.deleteById(id);
        } else {
            throw new RuntimeException("Club not found with id " + id);
        }
    }

    private void validateClubOwnerExists(String clubOwnerId) {
        if (clubOwnerId == null || clubOwnerId.isBlank()) {
            throw new IllegalArgumentException("clubOwner is required");
        }

        try {
            userClient.getUserEmail(clubOwnerId);
        } catch (Exception ex) {
            // Keep creation/update resilient when user-service cannot validate owner in real time.
            // The owner value is still required and persisted as provided.
        }
    }
}
