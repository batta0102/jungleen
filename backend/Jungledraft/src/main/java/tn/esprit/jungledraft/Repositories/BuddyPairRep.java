package tn.esprit.jungledraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.jungledraft.Entities.BuddyPair;

import java.util.List;

public interface BuddyPairRep extends JpaRepository<BuddyPair, Long> {
    // Seulement les méthodes vraiment nécessaires
    List<BuddyPair> findByClubIdClub(Long clubId);

    void deleteAllByClubIdClub(Long idClub);

}