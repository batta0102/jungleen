package tn.esprit.jungledraft.Repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.esprit.jungledraft.Entities.BuddySession;
import tn.esprit.jungledraft.Entities.SessionStatus;


import java.time.LocalDateTime;
import java.util.List;

public interface BuddySessionRep extends JpaRepository<BuddySession, Long> {
    // Seulement les méthodes vraiment nécessaires
    List<BuddySession> findByBuddyPairIdPair(Long buddyPairId);

    List<BuddySession> findByBuddyPairIdPairAndDateAfter(Long buddyPairId, LocalDateTime date);

    List<BuddySession> findByBuddyPairIdPairAndDateBefore(Long buddyPairId, LocalDateTime date);
    // Dans BuddySessionRep.java, ajoutez :
    List<BuddySession> findByStatus(SessionStatus status);
}