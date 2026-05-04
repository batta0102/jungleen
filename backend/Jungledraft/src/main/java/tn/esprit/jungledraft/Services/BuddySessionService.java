package tn.esprit.jungledraft.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.jungledraft.Entities.BuddySession;
import tn.esprit.jungledraft.Entities.SessionStatus;
import tn.esprit.jungledraft.Entities.SatisfactionLevel;
import tn.esprit.jungledraft.Repositories.BuddySessionRep;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuddySessionService {

    private final BuddySessionRep buddySessionRepository;
    private final BuddyService buddyService;

    public BuddySession create(BuddySession session) {
        System.out.println("=== CRÉATION SESSION ===");
        System.out.println("Session reçue: " + session);
        System.out.println("Status reçu: " + session.getStatus());

        if (session.getDuree() <= 0) {
            throw new RuntimeException("Duree must be positive");
        }

        if (session.getStatus() == null) {
            System.out.println("Status null, mise à PLANIFIEE par défaut");
            session.setStatus(SessionStatus.PLANIFIEE);
        }

        session.setConfirmeParUtilisateur1(false);
        session.setConfirmeParUtilisateur2(false);

        System.out.println("Session avant sauvegarde: " + session);
        System.out.println("Status avant sauvegarde: " + session.getStatus());

        BuddySession saved = buddySessionRepository.save(session);
        System.out.println("Session sauvegardée: " + saved);

        return saved;
    }

    public List<BuddySession> getAll() {
        return buddySessionRepository.findAll();
    }

    public Optional<BuddySession> getById(Long id) {
        return buddySessionRepository.findById(id);
    }

    public BuddySession update(BuddySession session) {
        Optional<BuddySession> existing = buddySessionRepository.findById(session.getIdSession());
        if (existing.isPresent()) {
            BuddySession toUpdate = existing.get();
            toUpdate.setDate(session.getDate());
            toUpdate.setDuree(session.getDuree());
            toUpdate.setStatus(session.getStatus());
            toUpdate.setSujet(session.getSujet());
            toUpdate.setNotes(session.getNotes());
            toUpdate.setConfirmeParUtilisateur1(session.isConfirmeParUtilisateur1());
            toUpdate.setConfirmeParUtilisateur2(session.isConfirmeParUtilisateur2());
            toUpdate.setSatisfactionUtilisateur1(session.getSatisfactionUtilisateur1());
            toUpdate.setSatisfactionUtilisateur2(session.getSatisfactionUtilisateur2());
            return buddySessionRepository.save(toUpdate);
        } else {
            throw new RuntimeException("BuddySession not found with id " + session.getIdSession());
        }
    }

    public void delete(Long id) {
        Optional<BuddySession> existing = buddySessionRepository.findById(id);
        if (existing.isPresent()) {
            buddySessionRepository.deleteById(id);
        } else {
            throw new RuntimeException("BuddySession not found with id " + id);
        }
    }

    // === MÉTHODES MÉTIER SIMPLES ===

    public List<BuddySession> getSessionsByBuddyPair(Long buddyPairId) {
        return buddySessionRepository.findByBuddyPairIdPair(buddyPairId);
    }

    // ✅ Nouvelle méthode avec LocalDateTime
    public List<BuddySession> getSessionsAVenir(Long buddyPairId) {
        LocalDateTime now = LocalDateTime.now();
        return buddySessionRepository.findByBuddyPairIdPairAndDateAfter(buddyPairId, now);
    }

    // ✅ Nouvelle méthode avec LocalDateTime
    public List<BuddySession> getHistoriqueSessions(Long buddyPairId) {
        LocalDateTime now = LocalDateTime.now();
        return buddySessionRepository.findByBuddyPairIdPairAndDateBefore(buddyPairId, now);
    }

    public BuddySession confirmerSession(Long sessionId, Long userId, SatisfactionLevel satisfaction) {
        BuddySession session = getById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session non trouvée"));

        if (!buddyService.getById(session.getBuddyPair().getIdPair())
                .map(bp -> bp.getUserID_1().equals(userId) || bp.getUserID_2().equals(userId))
                .orElse(false)) {
            throw new RuntimeException("L'utilisateur ne fait pas partie de cette session");
        }

        if (session.getBuddyPair().getUserID_1().equals(userId)) {
            session.setConfirmeParUtilisateur1(true);
            session.setSatisfactionUtilisateur1(satisfaction);
        } else {
            session.setConfirmeParUtilisateur2(true);
            session.setSatisfactionUtilisateur2(satisfaction);
        }

        if (session.isConfirmeParUtilisateur1() && session.isConfirmeParUtilisateur2()) {
            session.setStatus(SessionStatus.COMPLETEE);
        }

        return buddySessionRepository.save(session);
    }

    public List<BuddySession> getUpcomingSessions(Long buddyPairId) {
        Date now = new Date();
        LocalDateTime localNow = now.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
        return buddySessionRepository.findByBuddyPairIdPairAndDateAfter(buddyPairId, localNow);
    }

    public List<BuddySession> getSessionHistory(Long buddyPairId) {
        Date now = new Date();
        LocalDateTime localNow = now.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
        return buddySessionRepository.findByBuddyPairIdPairAndDateBefore(buddyPairId, localNow);
    }
}